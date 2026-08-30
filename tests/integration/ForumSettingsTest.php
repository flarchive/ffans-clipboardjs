<?php

namespace FFans\ClipboardJS\Tests\integration;

use Flarum\Testing\integration\TestCase;

class ForumSettingsTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->extension('ffans-clipboardjs');
    }

    /** @test */
    public function extension_assets_compile_on_forum_boot()
    {
        $response = $this->send($this->request('GET', '/'));

        $this->assertSame(200, $response->getStatusCode());
    }

    /** @test */
    public function extension_assets_compile_on_admin_boot()
    {
        $response = $this->send($this->request('GET', '/admin', ['authenticatedAs' => 1]));

        $this->assertSame(200, $response->getStatusCode());
    }

    /** @test */
    public function forum_api_uses_safe_defaults_when_settings_are_missing()
    {
        $attributes = $this->forumAttributes();

        $this->assertSame('default', $attributes['themeName']);
        $this->assertFalse($attributes['isCopyEnable']);
        $this->assertFalse($attributes['isShowCodeLang']);
    }

    /** @test */
    public function forum_api_serializes_saved_settings()
    {
        $this->setting('ffans-clipboardjs.theme_name', 'github');
        $this->setting('ffans-clipboardjs.is_copy_enable', '1');
        $this->setting('ffans-clipboardjs.is_show_codeLang', '1');

        $attributes = $this->forumAttributes();

        $this->assertSame('github', $attributes['themeName']);
        $this->assertTrue($attributes['isCopyEnable']);
        $this->assertTrue($attributes['isShowCodeLang']);
    }

    private function forumAttributes(): array
    {
        $response = $this->send($this->request('GET', '/api'));
        $payload = json_decode((string) $response->getBody(), true);

        $this->assertSame(200, $response->getStatusCode());

        return $payload['data']['attributes'];
    }
}
